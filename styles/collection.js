// Ma collection : solde, objets par collection, historique du grand livre.
// Lecture seule en décembre ; l'équipement arrivera avec la vitrine de profil.
import { ready, apiFetch, login } from '../components/auth.js?v=1.0.0';

const root = document.querySelector('.col-page');
const CURRENCY = root.dataset.currency || 'Éclats';
const $ = (sel) => root.querySelector(sel);
const fmtNum = new Intl.NumberFormat('fr-FR');
const fmtDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
const RARITY = { commun: 'Commun', peu_commun: 'Peu commun', rare: 'Rare', epique: 'Épique', legendaire: 'Légendaire', unique: 'Unique' };

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function itemCard(item) {
  const card = el('article', `col-item rarity-${item.rarity}`);
  if (item.image) {
    const img = document.createElement('img');
    img.src = `/api/loyalty/media/${encodeURIComponent(item.image)}`;
    img.alt = '';
    img.loading = 'lazy';
    card.append(img);
  } else {
    card.append(el('div', 'col-item-glyph', item.type === 'music' ? '♪' : '✦'));
  }
  card.append(el('h3', 'col-item-name', item.name));
  const meta = [item.type_label, RARITY[item.rarity] || item.rarity].filter(Boolean).join(' · ');
  card.append(el('p', 'col-item-meta', meta));
  if (item.serial_no) card.append(el('p', 'col-item-serial', `Exemplaire n°${item.serial_no}/${item.edition_limit}`));
  if (item.description) card.append(el('p', 'col-item-desc', item.description));
  if (item.audio) {
    const audio = document.createElement('audio');
    audio.controls = true;
    audio.preload = 'none';
    audio.src = `/api/loyalty/media/${encodeURIComponent(item.audio)}`;
    card.append(audio);
  }
  if (item.acquired_at) card.append(el('p', 'col-item-date', `Obtenu le ${fmtDate.format(new Date(item.acquired_at))}`));
  return card;
}

function silhouette(entry) {
  const card = el('article', `col-item is-missing rarity-${entry.rarity}`);
  card.append(el('div', 'col-item-glyph', '?'), el('h3', 'col-item-name', entry.name),
    el('p', 'col-item-meta', [entry.type_label, RARITY[entry.rarity]].filter(Boolean).join(' · ')));
  return card;
}

function renderInventory(inv) {
  const byKey = new Map(inv.items.map((i) => [i.key, i]));
  const box = $('[data-collections]');
  box.replaceChildren();
  if (!inv.collections.length) {
    box.append(el('p', 'sig-muted', 'Aucun objet pour le moment. Les transmissions du calendrier de l\'Avent en rapportent.'));
  }
  for (const c of inv.collections) {
    const section = el('section', 'col-collection');
    const head = el('header', 'col-collection-head');
    head.append(el('h2', 'sig-h2', c.name), el('span', 'col-progress', `${c.owned} / ${c.total}`));
    section.append(head);
    if (c.season_label) section.append(el('p', 'sig-kicker', c.season_label));
    const grid = el('div', 'col-grid');
    for (const entry of c.entries) grid.append(entry.owned ? itemCard(byKey.get(entry.key)) : silhouette(entry));
    section.append(grid);
    box.append(section);
  }
  $('[data-count]').textContent = fmtNum.format(inv.items.length);
}

let nextBefore = null;
function renderLedger(page, append) {
  const list = $('[data-ledger]');
  if (!append) list.replaceChildren();
  for (const e of page.entries) {
    const li = el('li', `col-ledger-row ${e.delta >= 0 ? 'is-plus' : 'is-minus'}`);
    li.append(
      el('span', 'col-ledger-date', fmtDate.format(new Date(e.created_at))),
      el('span', 'col-ledger-label', e.label || e.source_type),
      el('span', 'col-ledger-delta', `${e.delta >= 0 ? '+' : ''}${fmtNum.format(e.delta)} ${CURRENCY}`),
    );
    list.append(li);
  }
  nextBefore = page.next_before_id;
  $('[data-more]').hidden = !nextBefore;
  $('[data-history]').hidden = false;
}

async function load() {
  const user = await ready();
  if (!user) {
    $('[data-login]').hidden = false;
    $('[data-login]').addEventListener('click', () => login());
    return;
  }
  const [me, inv, ledger] = await Promise.all([
    apiFetch('/api/loyalty/me'), apiFetch('/api/loyalty/inventory'), apiFetch('/api/loyalty/ledger'),
  ]);
  if (!me || !me.success) {
    $('[data-collections]').append(el('p', 'sig-muted', (me && me.error) || 'Collection indisponible pour le moment.'));
    return;
  }
  $('[data-wallet]').hidden = false;
  $('[data-balance]').textContent = fmtNum.format(me.data.wallet.balance);
  $('[data-lifetime]').textContent = fmtNum.format(me.data.wallet.lifetime_earned);
  if (inv && inv.success) renderInventory(inv.data);
  if (ledger && ledger.success) renderLedger(ledger.data, false);
}

$('[data-more]').addEventListener('click', async () => {
  if (!nextBefore) return;
  const page = await apiFetch(`/api/loyalty/ledger?before_id=${nextBefore}`);
  if (page && page.success) renderLedger(page.data, true);
});

load();
