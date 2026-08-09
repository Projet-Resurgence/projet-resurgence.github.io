/**
 * Aperçu au survol des hyperliens du contenu éditorial.
 *
 * Une carte apparaît après un court délai sur les liens de `.pr-content` :
 *
 *   · lien externe  — titre, description et bannière déclarés par le site,
 *     récupérés par `/api/link-preview` (le serveur va chercher la page, le
 *     navigateur ne contacte jamais le site tiers) ;
 *   · lien interne  — construit sur place à partir du titre de la section
 *     visée et de sa première phrase, sans aucun appel réseau.
 *
 * Le texte reçu est inséré via `textContent` uniquement : cette page a un seul
 * moteur de rendu, `content_markdown.py`, et ce fichier n'en est pas un
 * deuxième (resurgence-web/CLAUDE.md, règle 16).
 */

const OPEN_DELAY = 320;
const CLOSE_DELAY = 180;
const GAP = 14;

const cache = new Map(); // href → data | null (échec mémorisé)

let card = null;
let openTimer = 0;
let closeTimer = 0;
let current = null; // l'ancre pour laquelle la carte est ouverte ou en attente

// ── La carte ────────────────────────────────────────────────────────────────

function ensureCard() {
  if (card) return card;
  card = document.createElement('div');
  card.className = 'pr-linkcard';
  card.hidden = true;
  card.innerHTML = `
    <div class="pr-linkcard__banner" hidden><img alt="" loading="lazy"></div>
    <div class="pr-linkcard__body">
      <span class="pr-linkcard__site">
        <img class="pr-linkcard__favicon" alt="" width="16" height="16" hidden>
        <span class="pr-linkcard__sitename"></span>
      </span>
      <strong class="pr-linkcard__title"></strong>
      <p class="pr-linkcard__desc"></p>
    </div>
  `;
  // Survoler la carte elle-même ne doit pas la fermer : on lit dedans.
  card.addEventListener('mouseenter', () => clearTimeout(closeTimer));
  card.addEventListener('mouseleave', scheduleClose);
  document.body.appendChild(card);
  return card;
}

function fill(data) {
  const el = ensureCard();
  el.querySelector('.pr-linkcard__sitename').textContent = data.site_name || data.host || '';
  el.querySelector('.pr-linkcard__title').textContent = data.title || data.host || '';

  // Une favicon manquante ou illisible ne doit pas laisser un carré cassé
  // devant le nom du site : on la cache et le nom reste seul.
  const favicon = el.querySelector('.pr-linkcard__favicon');
  favicon.hidden = !data.icon;
  if (data.icon) {
    favicon.onerror = () => { favicon.hidden = true; };
    favicon.src = data.icon;
  } else {
    favicon.removeAttribute('src');
  }
  const desc = el.querySelector('.pr-linkcard__desc');
  desc.textContent = data.description || '';
  desc.hidden = !data.description;

  const banner = el.querySelector('.pr-linkcard__banner');
  const img = banner.querySelector('img');
  if (data.image) {
    banner.hidden = false;
    img.onerror = () => { banner.hidden = true; };
    img.src = data.image;
  } else {
    banner.hidden = true;
    img.removeAttribute('src');
  }
  el.classList.toggle('pr-linkcard--internal', Boolean(data.internal));
}

/** Placée sous le lien, ramenée dans la fenêtre, retournée au-dessus si besoin. */
function place(anchor) {
  const el = ensureCard();
  el.hidden = false;
  const rect = anchor.getBoundingClientRect();
  const size = el.getBoundingClientRect();
  const margin = 12;

  let left = rect.left + rect.width / 2 - size.width / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - size.width - margin));

  let top = rect.bottom + GAP;
  if (top + size.height > window.innerHeight - margin) {
    const above = rect.top - GAP - size.height;
    top = above >= margin ? above : Math.max(margin, window.innerHeight - size.height - margin);
  }
  el.style.left = `${Math.round(left + window.scrollX)}px`;
  el.style.top = `${Math.round(top + window.scrollY)}px`;
}

function show(anchor, data) {
  if (current !== anchor) return; // le curseur est déjà reparti
  fill(data);
  place(anchor);
  ensureCard().classList.add('is-open');
}

function hide() {
  current = null;
  if (!card) return;
  card.classList.remove('is-open');
  card.hidden = true;
}

function scheduleClose() {
  clearTimeout(closeTimer);
  closeTimer = window.setTimeout(hide, CLOSE_DELAY);
}

// ── Les données ─────────────────────────────────────────────────────────────

/**
 * Une adresse déclarée par une page du site, ramenée à un chemin de notre
 * propre origine. `og:image` est absolu (il sert aux réseaux sociaux) et
 * pointe le domaine public : servi tel quel il serait bloqué par
 * `img-src 'self'` dès qu'on n'est pas sur ce domaine — en local, par exemple.
 */
function ownPath(raw, doc) {
  if (!raw) return '';
  try {
    const url = new URL(raw, doc.baseURI || window.location.href);
    return url.pathname + url.search;
  } catch (e) {
    return '';
  }
}

/** La bannière et la favicon que la page déclare pour elle-même. Chaque page
 *  éditoriale a la sienne (`page.og_image` dans app.py), d'où les variantes. */
function ownImages(doc) {
  const meta = doc.querySelector('meta[property="og:image"], meta[name="og:image"]');
  const icon =
    doc.querySelector('link[rel~="icon"][href$=".png"]') ||
    doc.querySelector('link[rel~="icon"]') ||
    doc.querySelector('link[rel~="apple-touch-icon"]');
  return {
    image: ownPath(meta && meta.getAttribute('content'), doc),
    icon: ownPath(icon && icon.getAttribute('href'), doc),
  };
}

/** Décrit une section à partir d'un document déjà rendu par le serveur. */
function describeSection(doc, id, siteName) {
  const target = id ? doc.getElementById(id) : null;
  const scope = target || doc.querySelector('.v-doc__main, .v-univers__main') || doc.body;
  if (!scope) return null;
  // `[data-field]` porte le titre seul ; le `<h3>` y ajoute sa numérotation.
  const heading =
    scope.querySelector('[data-field="title"]') ||
    scope.querySelector('h1, h2, h3, h4') ||
    doc.querySelector('h1');
  const body = scope.querySelector('.pr-content') || scope;
  const text = (body.textContent || '').replace(/\s+/g, ' ').trim();
  const sentence = text.split(/(?<=[.!?…])\s/)[0] || text;
  const own = ownImages(doc);
  return {
    internal: true,
    site_name: siteName,
    title: (heading?.textContent || '').trim() || (doc.title || '').split('—')[0].trim(),
    description: sentence.slice(0, 240),
    image: own.image,
    icon: own.icon,
  };
}

/** Une ancre de la page courante : la section visée est déjà sous les yeux. */
function localPreview(anchor) {
  const id = decodeURIComponent((anchor.getAttribute('href') || '').split('#')[1] || '');
  return document.getElementById(id) ? describeSection(document, id, 'Sur cette page') : null;
}

const pages = new Map(); // chemin → Document | null

/**
 * Une autre page du site. Le serveur l'a déjà rendue en entier (c'est tout
 * l'intérêt du rendu serveur) : on la lit, on n'interprète rien. Le fetch est
 * de même origine, donc `connect-src 'self'` suffit et rien ne sort du site.
 */
async function sitePreview(url) {
  const path = url.pathname + url.search;
  if (!pages.has(path)) {
    try {
      const resp = await fetch(path, { credentials: 'same-origin' });
      const html = resp.ok ? await resp.text() : '';
      pages.set(path, html ? new DOMParser().parseFromString(html, 'text/html') : null);
    } catch (e) {
      pages.set(path, null);
    }
  }
  const doc = pages.get(path);
  if (!doc) return null;
  const id = decodeURIComponent((url.hash || '').slice(1));
  return describeSection(doc, id, 'Projet Résurgence');
}

async function remotePreview(href) {
  if (cache.has(href)) return cache.get(href);
  let data = null;
  try {
    const resp = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`);
    const payload = await resp.json();
    if (resp.ok && payload.success) data = payload.data;
  } catch (e) {
    data = null;
  }
  cache.set(href, data);
  return data;
}

function fallback(href) {
  try {
    const url = new URL(href);
    return { site_name: url.hostname.replace(/^www\./, ''), title: url.hostname.replace(/^www\./, ''), description: '', image: '' };
  } catch (e) {
    return null;
  }
}

// ── Survol ──────────────────────────────────────────────────────────────────

/** Les liens du contenu publié, et eux seuls — pas la navigation, pas la
 *  barre d'administration, et rien pendant que le contenu est en édition. */
function candidate(node) {
  if (document.body.classList.contains('v-admin-edit')) return null;
  if (!(node instanceof Element)) return null;
  const anchor = node.closest('.pr-content a[href]');
  return anchor && anchor.getAttribute('href') ? anchor : null;
}

async function open(anchor) {
  current = anchor;
  let absolute;
  try {
    absolute = new URL(anchor.getAttribute('href'), window.location.href);
  } catch (e) {
    return;
  }
  if (absolute.origin === window.location.origin) {
    const local =
      absolute.pathname === window.location.pathname
        ? localPreview(anchor)
        : await sitePreview(absolute);
    if (local) show(anchor, local);
    return;
  }
  if (!/^https?:$/.test(absolute.protocol)) return;
  const data = (await remotePreview(absolute.href)) || fallback(absolute.href);
  if (data) show(anchor, data);
}

document.addEventListener('mouseover', (e) => {
  const anchor = candidate(e.target);
  if (!anchor) return;
  if (anchor === current) {
    clearTimeout(closeTimer);
    return;
  }
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  openTimer = window.setTimeout(() => open(anchor), OPEN_DELAY);
});

document.addEventListener('mouseout', (e) => {
  if (!candidate(e.target)) return;
  clearTimeout(openTimer);
  scheduleClose();
});

// Le mode édition remplace les liens par des textarea, et un défilement laisse
// la carte accrochée à un lien qui n'est plus là.
window.addEventListener('scroll', () => { if (current) hide(); }, { passive: true });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

export { candidate, localPreview };
