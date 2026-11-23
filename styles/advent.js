// Calendrier de l'Avent — « Le Signal ».
//
// Le serveur a déjà rendu la grille publique (accroches des cases verrouillées).
// Ici : l'état du joueur, l'ouverture d'une case, le ravitaillement, les paliers.
// Tout texte venant des données passe par textContent ; seul `body_html`, rendu
// côté serveur par content_markdown.py (le seul moteur du site), est injecté tel quel.
import { ready, apiFetch, login } from '../components/auth.js?v=1.0.0';

const root = document.querySelector('.sig-page');
const KEY = root.dataset.eventKey;
const CURRENCY = root.dataset.currency || 'Éclats';
const $ = (sel, el = root) => el.querySelector(sel);

let state = null;      // dernière projection reçue
let signedIn = false;
let busy = false;

const fmtDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  timeZone: 'Europe/Paris',
});
const fmtNum = new Intl.NumberFormat('fr-FR');

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function stateLabel(s) {
  return {
    locked: 'Brouillé', open: 'À capter', catch_up: 'À rattraper', claimed: 'Capté',
    missed: 'Perdu', closed: 'Terminé',
  }[s] || 'Capté';
}

// ── Rendu ──────────────────────────────────────────────────────────────────

function renderGrid() {
  const grid = $('[data-grid]');
  grid.replaceChildren();
  for (const slot of state.slots) {
    const li = el('li', `sig-slot is-${slot.state}`);
    li.dataset.position = slot.position;
    const btn = el('button', 'sig-slot-btn');
    btn.type = 'button';
    btn.dataset.open = slot.position;
    if (slot.state === 'locked') btn.setAttribute('aria-disabled', 'true');
    btn.append(
      el('span', 'sig-slot-num', String(slot.position).padStart(2, '0')),
      el('span', 'sig-slot-freq', slot.frequency || '— MHz'),
      el('span', 'sig-slot-state', stateLabel(slot.state)),
    );
    if (slot.teaser) btn.append(el('span', 'sig-slot-teaser', slot.teaser));
    btn.setAttribute('aria-label',
      `Case ${slot.position} — ${stateLabel(slot.state)}` +
      (slot.state === 'locked' ? `, s'ouvre ${fmtDate.format(new Date(slot.unlocks_at))}` : ''));
    li.append(btn);
    grid.append(li);
  }
  const opened = state.slots.filter((s) => s.state !== 'locked').length;
  const needle = $('[data-needle]');
  if (needle) needle.style.setProperty('--sig-pos', String(Math.max(opened - 1, 0) / Math.max(state.slots.length - 1, 1)));
}

function renderStatus() {
  const line = $('[data-status]');
  if (state.next_unlock_at) {
    line.replaceChildren('Prochaine transmission : ', el('time', null, fmtDate.format(new Date(state.next_unlock_at))));
  } else {
    line.textContent = 'Toutes les fréquences sont ouvertes.';
  }
  const wallet = $('[data-wallet]');
  const loginBtn = $('[data-login]');
  if (signedIn && state.wallet) {
    wallet.hidden = false;
    loginBtn.hidden = true;
    $('[data-balance]').textContent = fmtNum.format(state.wallet.balance);
  } else {
    wallet.hidden = true;
    loginBtn.hidden = false;
  }
}

function renderDaily() {
  const box = $('[data-daily]');
  const d = state.daily;
  if (!signedIn || !d || !d.enabled) { box.hidden = true; return; }
  box.hidden = false;
  const btn = $('[data-daily-claim]');
  const text = $('[data-daily-text]');
  if (d.claimed_today) {
    btn.disabled = true;
    btn.textContent = 'Récupéré';
    text.textContent = `Série : ${d.streak} jour${d.streak > 1 ? 's' : ''}. Prochain ravitaillement ${fmtDate.format(new Date(d.next_claim_at))}.`;
  } else {
    btn.disabled = false;
    btn.textContent = `Récupérer +${d.points}`;
    text.textContent = d.next_bonus_in === 0
      ? `Bonus de série aujourd'hui : +${d.streak_bonus} ${CURRENCY} en plus.`
      : `Revenez chaque jour : bonus de +${d.streak_bonus} ${CURRENCY} tous les ${d.streak_days} jours.`;
  }
}

function renderCommunity() {
  const c = state.community;
  if (!c) return;
  const goal = (c.goals || [])[0];
  $('[data-community-total]').textContent = fmtNum.format(c.total_claims);
  $('[data-community-participants]').textContent = fmtNum.format(c.participants);
  const list = $('[data-tiers]');
  list.replaceChildren();
  if (!goal) return;
  const max = Math.max(...goal.tiers.map((t) => t.threshold), 1);
  const bar = $('[data-community-bar]');
  bar.setAttribute('aria-valuemax', String(max));
  bar.setAttribute('aria-valuenow', String(c.total_claims));
  $('[data-community-fill]').style.width = `${Math.min(100, (c.total_claims / max) * 100)}%`;
  for (const tier of goal.tiers) {
    const li = el('li', `sig-tier${tier.reached ? ' is-reached' : ''}`);
    li.style.setProperty('--sig-at', String(tier.threshold / max));
    li.append(el('span', 'sig-tier-threshold', fmtNum.format(tier.threshold)), el('span', 'sig-tier-title', tier.title));
    if (tier.reached && tier.description_html) {
      const d = el('div', 'sig-tier-desc pr-content');
      d.innerHTML = tier.description_html; // rendu serveur (content_markdown.py)
      li.append(d);
    }
    if (tier.claimable) {
      const b = el('button', 'sig-btn sig-btn-small', 'Récupérer');
      b.type = 'button';
      b.addEventListener('click', () => claimTier(tier.id, b));
      li.append(b);
    } else if (tier.claimed) {
      li.append(el('span', 'sig-tier-done', 'Récupéré'));
    }
    list.append(li);
  }
}

function renderCompletion() {
  const box = $('[data-completion]');
  const c = state.completion;
  if (!c || !c.rewards || !c.rewards.length) { box.hidden = true; return; }
  const names = c.rewards.map((r) => (r.kind === 'points' ? `${r.points} ${CURRENCY}` : r.collectible.name)).join(' + ');
  const total = state.slots.length;
  box.hidden = false;
  box.replaceChildren(
    el('strong', null, `Captez les ${total} transmissions`),
    ` (rattrapages compris) : ${names}.`,
    signedIn && state.claimed_count !== null && state.claimed_count !== undefined
      ? el('span', 'sig-complete-count', ` ${state.claimed_count} / ${total}`) : '',
  );
}

function renderAll() {
  renderCompletion();
  renderGrid();
  renderStatus();
  renderDaily();
  renderCommunity();
}

// ── Transmission (dialogue) ────────────────────────────────────────────────

function describeRewards(rewards, granted) {
  const box = el('div', 'sig-rewards');
  const items = granted
    ? [
      ...(granted.points ? [{ kind: 'points', points: granted.points }] : []),
      ...(granted.items || []).map((i) => ({ kind: 'item', name: i.name, serial: i.serial_no, limit: i.edition_limit })),
      ...(granted.converted || []).map((i) => ({ kind: 'converted', name: i.name, points: i.points })),
      ...((granted.completion && granted.completion.items) || []).map((i) => ({ kind: 'item', name: `Complet ! ${i.name}`, rarity: 'legendaire' })),
    ]
    : (rewards || []).map((r) => (r.kind === 'points'
      ? { kind: 'points', points: r.points }
      : { kind: 'item', name: r.collectible.name, rarity: r.collectible.rarity, type: r.collectible.type_label }));
  for (const r of items) {
    if (r.kind === 'points') box.append(el('span', 'sig-reward is-points', `+${fmtNum.format(r.points)} ${CURRENCY}`));
    else if (r.kind === 'item') {
      const label = r.serial ? `${r.name} · n°${r.serial}/${r.limit}` : r.name;
      box.append(el('span', `sig-reward is-item${r.rarity ? ` rarity-${r.rarity}` : ''}`, label));
    } else if (r.kind === 'converted') {
      box.append(el('span', 'sig-reward is-converted', `${r.name} déjà possédé : +${r.points} ${CURRENCY}`));
    }
  }
  return box;
}

function openSlot(position) {
  const slot = state.slots.find((s) => s.position === position);
  const dialog = $('[data-dialog]');
  const claimBtn = $('[data-dialog-claim]');
  const msg = $('[data-dialog-msg]');
  msg.textContent = '';
  $('[data-dialog-media]').replaceChildren();
  $('[data-dialog-rewards]').replaceChildren();
  $('[data-dialog-body]').replaceChildren();
  $('[data-dialog-kicker]').textContent = `Transmission n°${position}${slot.frequency ? ` · ${slot.frequency}` : ''}`;

  if (slot.state === 'locked') {
    $('[data-dialog-title]').textContent = 'Signal brouillé';
    $('[data-dialog-body]').append(el('p', null, `Cette fréquence s'ouvrira ${fmtDate.format(new Date(slot.unlocks_at))}.`));
    if (slot.teaser) $('[data-dialog-body]').append(el('p', 'sig-muted', slot.teaser));
    claimBtn.hidden = true;
  } else {
    $('[data-dialog-title]').textContent = slot.title || `Transmission n°${position}`;
    const body = $('[data-dialog-body]');
    body.innerHTML = slot.body_html || ''; // rendu serveur (content_markdown.py)
    for (const m of slot.media || []) {
      if (m.kind === 'audio') {
        const fig = el('figure', 'sig-audio');
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';
        audio.src = `/api/loyalty/media/${encodeURIComponent(m.key)}`;
        fig.append(el('figcaption', null, m.title), audio);
        $('[data-dialog-media]').append(fig);
      } else if (m.kind === 'image') {
        const img = document.createElement('img');
        img.src = `/api/loyalty/media/${encodeURIComponent(m.key)}`;
        img.alt = m.title || '';
        img.loading = 'lazy';
        $('[data-dialog-media]').append(img);
      }
    }
    $('[data-dialog-rewards]').append(describeRewards(slot.rewards, slot.granted));
    if (slot.state === 'claimed') {
      claimBtn.hidden = true;
      msg.textContent = slot.was_catch_up ? 'Transmission captée (en rattrapage).' : 'Transmission captée.';
    } else if (slot.state === 'missed' || slot.state === 'closed') {
      claimBtn.hidden = true;
      msg.textContent = 'Cette transmission ne peut plus être captée.';
    } else if (!signedIn) {
      claimBtn.hidden = false;
      claimBtn.textContent = 'Se connecter pour capter';
      claimBtn.onclick = () => login();
    } else {
      claimBtn.hidden = false;
      claimBtn.disabled = false;
      claimBtn.textContent = slot.state === 'catch_up' ? 'Rattraper la transmission' : 'Capter la transmission';
      claimBtn.onclick = () => claimSlot(position, claimBtn, msg);
    }
  }
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
}

async function claimSlot(position, btn, msg) {
  if (busy) return;
  busy = true;
  btn.disabled = true;
  msg.textContent = 'Accord de la fréquence…';
  try {
    const res = await apiFetch(`/api/loyalty/event/${encodeURIComponent(KEY)}/slots/${position}/claim`, { method: 'POST' });
    if (res && res.success) {
      root.classList.add('is-celebrating');
      setTimeout(() => root.classList.remove('is-celebrating'), 1600);
      $('[data-dialog-rewards]').replaceChildren(describeRewards(null, res.data.granted));
      msg.textContent = res.data.already_claimed ? 'Déjà captée — rien de plus à récupérer.' : 'Transmission captée !';
      btn.hidden = true;
      await refresh();
    } else {
      msg.textContent = (res && (res.error || res.message)) || 'La transmission a échoué. Réessayez.';
      btn.disabled = false;
      if (res && res.code === 'account_required') signedIn = false;
    }
  } catch (e) {
    msg.textContent = 'Connexion perdue. Rechargez la page avant de réessayer.';
  } finally {
    busy = false;
  }
}

async function claimDaily() {
  if (busy) return;
  busy = true;
  const btn = $('[data-daily-claim]');
  btn.disabled = true;
  try {
    const res = await apiFetch('/api/loyalty/daily/claim', { method: 'POST' });
    if (!res || !res.success) $('[data-daily-text]').textContent = (res && res.error) || 'Échec. Réessayez plus tard.';
    await refresh();
  } finally {
    busy = false;
  }
}

async function claimTier(tierId, btn) {
  if (busy) return;
  busy = true;
  btn.disabled = true;
  try {
    const res = await apiFetch(`/api/loyalty/tiers/${tierId}/claim`, { method: 'POST' });
    if (!res || !res.success) btn.replaceWith(el('span', 'sig-tier-done', (res && res.error) || 'Échec.'));
    await refresh();
  } finally {
    busy = false;
  }
}

// ── Données ────────────────────────────────────────────────────────────────

async function refresh() {
  const res = await apiFetch(`/api/loyalty/event/${encodeURIComponent(KEY)}`);
  if (!res || !res.success) {
    if (!state) $('[data-status]').textContent = "Le signal n'est pas encore capté. Revenez le 1er décembre.";
    return;
  }
  state = res.data;
  signedIn = Boolean(state.signed_in);
  renderAll();
}

root.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-open]');
  if (btn && state) openSlot(Number(btn.dataset.open));
});
$('[data-login]').addEventListener('click', () => login());
$('[data-daily-claim]').addEventListener('click', claimDaily);

ready().then(refresh);
// Une case s'ouvre à minuit : on se recale toutes les minutes tant que la page est visible.
setInterval(() => { if (!document.hidden && !busy && state) refresh(); }, 60_000);
