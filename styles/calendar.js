// Calendrier de jeu — Atlas design (3a).
//
// Le mois comme relevé : la correspondance réel ↔ 2303 est écrite dans chaque
// case, l'administration passe du bloc en tête de page à un encart de colonne,
// et le bandeau de reprise dit ce qui reste jouable pendant la pause.
//
// Public reads work logged out. The admin encart (pause, announced resume date,
// playdays-per-month, force-advance) only renders for a logged-in administrator,
// and every write is re-checked server-side by @require_admin.

import { ready, isAdmin, apiFetch } from '../components/auth.js?v=1.0.0';

const CAL_MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet',
    'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const CAL_MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.',
    'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const CAL_WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const calState = {
    loaded: false,
    loading: false,
    dateMap: {},            // "YYYY-MM-DD" -> [ { year, month, playday }, ... ]
    playdaysPerMonth: {},   // gameMonth(str) -> current-year config total
    monthMax: {},           // "gameYear-gameMonth" -> highest playday seen that year/month
    frontierKey: null,      // "gameYear-gameMonth" of the latest game date
    firstReal: null,        // earliest real_date string, or null
    latestReal: null,       // latest real_date string, or null
    notes: {},              // localStorage-backed notes (day iso / period key -> text)
    noteCtx: null,          // context of the note currently being edited
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(), // 0-indexed IRL month
    isPaused: false,            // current pause status
    plannedResumeDate: null,    // "YYYY-MM-DD" or null - admin-set, not guaranteed
};

const CAL_BANNER_DISMISS_PREFIX = 'pr_cal_banner_dismissed_';
const CAL_NOTES_KEY = 'pr_calendar_notes';

// ── Toasts ──────────────────────────────────────────────────────────

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('cal-toasts');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `cal-toast cal-toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}

// ── Calendar notes (stored locally, per device) ─────────────────────

function calLoadNotes() {
    try { return JSON.parse(localStorage.getItem(CAL_NOTES_KEY)) || {}; }
    catch (e) { return {}; }
}

function calPersistNotes() {
    try { localStorage.setItem(CAL_NOTES_KEY, JSON.stringify(calState.notes)); }
    catch (e) {}
}

function calPeriodKey(p) {
    return p ? `period:${p.start}..${p.end || ''}` : null;
}

function calEsc(s) {
    return String(s).replace(/[&<>"]/g, c => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Enter saves & closes; Shift+Enter inserts a newline.
function calNoteKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        calSaveNote();
    }
}

function calFmtFull(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const wd = CAL_WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    return `${wd} ${d} ${CAL_MONTHS[m - 1]} ${y}`;
}

function calOpenNote(iso) {
    const info = calClassify(iso);
    const ctx = { iso, periodKey: null };
    const periodWrap = document.getElementById('cal-note-period-wrap');
    let state;
    if (info.type === 'play') {
        const gd = info.gds[info.gds.length - 1];
        state = `${CAL_MONTHS[gd.month - 1]} ${gd.playday}/${calMonthTotal(gd.year, gd.month, gd.playday)} ${gd.year}`;
        if (info.gds.length > 1) state += ` · ${info.gds.length} jours de jeu ce jour-là`;
        periodWrap.style.display = 'none';
    } else if (info.type === 'pause') {
        const p = calPausePeriod(iso);
        ctx.periodKey = calPeriodKey(p);
        state = p.end === null
            ? `En pause depuis ${calFmtDate(p.start)} — fin indéfinie`
            : `En pause : ${calFmtDate(p.start)} → ${calFmtDate(p.end)}`;
        document.getElementById('cal-note-period-label').textContent = p.end === null
            ? `Note de la période (depuis ${calFmtDate(p.start)}, en cours)`
            : `Note de la période (${calFmtDate(p.start)} → ${calFmtDate(p.end)})`;
        document.getElementById('cal-note-period').value = calState.notes[ctx.periodKey] || '';
        periodWrap.style.display = 'block';
    } else if (info.type === 'preview') {
        const pv = info.preview;
        state = `Prévision : ${CAL_MONTHS[pv.month - 1]} ${pv.playday} ${pv.year} — date non garantie, peut changer`;
        periodWrap.style.display = 'none';
    } else {
        state = 'Période hors de jeu';
        periodWrap.style.display = 'none';
    }
    document.getElementById('cal-note-title').textContent = calFmtFull(iso);
    document.getElementById('cal-note-state').textContent = state;
    document.getElementById('cal-note-day').value = calState.notes[iso] || '';
    calState.noteCtx = ctx;
    document.getElementById('cal-note-overlay').classList.add('open');
    document.getElementById('cal-note-day').focus();
}

function calSaveNote() {
    const ctx = calState.noteCtx;
    if (!ctx) return;
    const dayVal = document.getElementById('cal-note-day').value.trim();
    if (dayVal) calState.notes[ctx.iso] = dayVal; else delete calState.notes[ctx.iso];
    if (ctx.periodKey) {
        const pVal = document.getElementById('cal-note-period').value.trim();
        if (pVal) calState.notes[ctx.periodKey] = pVal; else delete calState.notes[ctx.periodKey];
    }
    calPersistNotes();
    calCloseNote();
    renderCalendar();
}

function calCloseNote() {
    document.getElementById('cal-note-overlay').classList.remove('open');
    calState.noteCtx = null;
}

// ── Date maths ──────────────────────────────────────────────────────

function calAddDays(iso, n) {
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + n);
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(dt.getUTCDate()).padStart(2, '0');
    return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

function calFmtDate(iso) {
    const [, m, d] = iso.split('-').map(Number);
    return `${d} ${CAL_MONTHS_SHORT[m - 1]}`;
}

// For a pause day, return the bounding period { start, end }.
// end === null means the pause is current/predicted (no game day after it).
function calPausePeriod(iso) {
    const latest = calState.latestReal;
    const planned = calState.plannedResumeDate;
    if (!latest || iso > latest) {
        const start = latest ? calAddDays(latest, 1) : iso;
        // When a resume date is planned, the pause ends the day before it
        // (the bot unpauses one day ahead so the 07:00 tick can fire).
        const end = planned && planned > start ? calAddDays(planned, -1) : null;
        return { start, end };
    }
    let start = iso;
    for (let d = calAddDays(iso, -1); d >= calState.firstReal && !calState.dateMap[d]; d = calAddDays(d, -1)) {
        start = d;
    }
    let end = iso;
    for (let e = calAddDays(iso, 1); e <= latest && !calState.dateMap[e]; e = calAddDays(e, 1)) {
        end = e;
    }
    return { start, end };
}

// Total playdays for a given game (year, month). The configured count wins
// whenever known — it's correct for past, current and not-yet-reached
// months alike; monthMax/fallback only cover months missing from config.
function calMonthTotal(gameYear, gameMonth, fallback) {
    const key = gameYear + '-' + gameMonth;
    const cfg = calState.playdaysPerMonth[String(gameMonth)];
    return cfg || calState.monthMax[key] || fallback;
}

function calIso(year, monthIdx, day) {
    const m = String(monthIdx + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
}

// Advance one playday, mirroring the backend's calculate_next_date.
function calAdvancePlayday(year, month, playday) {
    const total = calState.playdaysPerMonth[String(month)] || 1;
    if (playday < total) return { year, month, playday: playday + 1 };
    if (month < 12) return { year, month: month + 1, playday: 1 };
    return { year: year + 1, month: 1, playday: 1 };
}

// Walk forward one real day at a time from the planned resume date, mirroring
// the backend's fully-automatic mid-year pause: whenever the walk would roll
// June (6) into July (7), that rollover is held back for 2 real days (shown
// as plain pause cells) before July 1 actually lands.
function calWalkPreview(targetIso) {
    const [frontierYear, frontierMonth] = calState.frontierKey.split('-').map(Number);
    const frontierPlayday = calState.monthMax[calState.frontierKey] || 1;
    let state = { year: frontierYear, month: frontierMonth, playday: frontierPlayday };
    let gapRemaining = 0;
    let pendingState = null;
    let permanentPause = false; // year-end pause: indefinite, staff-resumed — never auto-continues
    let cursor = calState.plannedResumeDate;
    for (;;) {
        let dayResult;
        if (permanentPause) {
            dayResult = { pause: true };
        } else if (gapRemaining > 0) {
            gapRemaining--;
            if (gapRemaining === 0 && pendingState) {
                // Gap over: this day is July 1 itself, not a further advance.
                state = pendingState;
                pendingState = null;
                dayResult = { pause: false, state: { ...state } };
            } else {
                dayResult = { pause: true };
            }
        } else {
            const next = calAdvancePlayday(state.year, state.month, state.playday);
            if (state.month === 12 && next.month === 1) {
                // Dec -> Jan is the indefinite year-end pause: no known resume
                // date exists yet, so the forecast cannot project past it.
                permanentPause = true;
                dayResult = { pause: true };
            } else if (state.month === 6 && next.month === 7) {
                gapRemaining = 2; // 2 real days held back before July 1 lands
                pendingState = next;
                dayResult = { pause: true };
            } else {
                state = next;
                dayResult = { pause: false, state: { ...state } };
            }
        }
        if (cursor === targetIso) return dayResult;
        cursor = calAddDays(cursor, 1);
    }
}

// Project the (year, month, playday) of an IRL day that falls on/after the
// planned resume date, by walking forward from the actual last known game date.
function calProjectPreview(iso) {
    const planned = calState.plannedResumeDate;
    if (!planned || iso < planned || !calState.frontierKey) return null;
    const result = calWalkPreview(iso);
    return result.pause ? null : result.state;
}

// Classify an IRL day (ISO string) against the game date data.
function calClassify(iso) {
    const gds = calState.dateMap[iso];
    if (gds && gds.length) return { type: 'play', gds };
    if (!calState.firstReal) return { type: 'offgame' };
    if (iso < calState.firstReal) return { type: 'offgame' };
    const preview = calProjectPreview(iso);
    if (preview) return { type: 'preview', preview };
    return { type: 'pause' };
}

// ── Loading ─────────────────────────────────────────────────────────

async function loadCalendar(force = false) {
    calState.notes = calLoadNotes();
    if (calState.loaded && !force) { renderCalendar(); calRenderBanner(); renderTodayCard(); renderMonthStats(); return; }
    if (calState.loading) return;
    calState.loading = true;
    const loadingEl = document.getElementById('cal-loading');
    if (loadingEl) loadingEl.style.display = 'block';
    try {
        const [resp, pauseResp] = await Promise.all([
            fetch('/api/calendar').then(r => r.json()).catch(() => null),
            fetch('/api/pause-schedule').then(r => r.json()).catch(() => null),
        ]);
        if (resp && resp.success && resp.data) {
            const dates = resp.data.dates || [];
            calState.playdaysPerMonth = resp.data.playdays_per_month || {};
            const map = {};
            const monthMax = {};
            let frontierKey = null, frontierOrd = -1;
            for (const row of dates) {
                (map[row.real_date] = map[row.real_date] || []).push(
                    { year: row.year, month: row.month, playday: row.playday });
                const key = row.year + '-' + row.month;
                monthMax[key] = Math.max(monthMax[key] || 0, row.playday);
                const ord = row.year * 100 + row.month;
                if (ord > frontierOrd) { frontierOrd = ord; frontierKey = key; }
            }
            calState.dateMap = map;
            calState.monthMax = monthMax;
            calState.frontierKey = frontierKey;
            calState.firstReal = dates.length ? dates[0].real_date : null;
            calState.latestReal = dates.length ? dates[dates.length - 1].real_date : null;
            calState.loaded = true;
        }
        if (pauseResp && pauseResp.success && pauseResp.data) {
            calState.isPaused = !!pauseResp.data.is_paused;
            calState.plannedResumeDate = pauseResp.data.planned_resume_date || null;
        }
    } catch (e) {
    } finally {
        calState.loading = false;
        if (loadingEl) loadingEl.style.display = 'none';
        renderCalendar();
        calRenderBanner();
        renderTodayCard();
        renderMonthStats();
        renderAdminPanel();
    }
}

function calNavigate(delta) {
    let m = calState.viewMonth + delta;
    let y = calState.viewYear;
    while (m < 0) { m += 12; y -= 1; }
    while (m > 11) { m -= 12; y += 1; }
    calState.viewMonth = m;
    calState.viewYear = y;
    renderCalendar();
    renderMonthStats();
}

function calGoToday() {
    const now = new Date();
    calState.viewYear = now.getFullYear();
    calState.viewMonth = now.getMonth();
    renderCalendar();
    renderMonthStats();
}

// ── Render : grille du mois ─────────────────────────────────────────

function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const title = document.getElementById('cal-title');
    const rangeEl = document.getElementById('cal-month-range');
    if (!grid || !title) return;

    const year = calState.viewYear;
    const month = calState.viewMonth;
    title.textContent = `${CAL_MONTHS[month]} ${year}`;

    // Show the 2303 range for the current view month, if any game dates fall in it.
    if (rangeEl) {
        const range = calMonthRange(year, month);
        rangeEl.textContent = range ? `— ${range}` : '';
    }

    const todayIso = calIso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = '';
    for (let i = 0; i < firstDow; i++) {
        html += '<div class="cal-cell cal-empty"></div>';
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const iso = calIso(year, month, day);
        const info = calClassify(iso);
        const isToday = iso === todayIso ? ' cal-today' : '';
        let body = '';
        const dayNote = calState.notes[iso];
        let periodNote = null;

        if (info.type === 'play') {
            // Show the full 2303 date inside the cell — "Mars 2303 · 14/30".
            const gd = info.gds[info.gds.length - 1];
            const total = calMonthTotal(gd.year, gd.month, gd.playday);
            body = `<span class="cal-gamedate">${CAL_MONTHS[gd.month - 1]} ${gd.year} · ${gd.playday}/${total}</span>`;
            if (info.gds.length > 1) {
                body += `<span class="cal-tag">${info.gds.length}j</span>`;
            }
        } else if (info.type === 'preview') {
            const pv = info.preview;
            const total = calMonthTotal(pv.year, pv.month, pv.playday);
            body = `<span class="cal-gamedate">${CAL_MONTHS[pv.month - 1]} ${pv.year} · ${pv.playday}/${total}</span>`
                  + `<span class="cal-preview-badge" title="Date prévisionnelle — non garantie, peut changer">★</span>`;
        } else if (info.type === 'pause') {
            const p = calPausePeriod(iso);
            periodNote = calState.notes[calPeriodKey(p)] || null;
            body = '<span class="cal-tag">pause</span>';
        } else {
            body = '<span class="cal-tag">hors jeu</span>';
        }

        if (dayNote) body += `<div class="cal-note-text">${calEsc(dayNote)}</div>`;
        if (periodNote) body += `<div class="cal-note-text cal-note-text-period">${calEsc(periodNote)}</div>`;
        const badge = (dayNote || periodNote) ? '<span class="cal-note-badge">✎</span>' : '';
        const previewStart = (info.type === 'preview' && iso === calState.plannedResumeDate) ? ' cal-preview-start' : '';
        html += `<div class="cal-cell cal-${info.type}${isToday}${previewStart}" onclick="calOpenNote('${iso}')">`
              + `${badge}<span class="cal-daynum">${day}</span>${body}</div>`;
    }
    grid.innerHTML = html;
}

// Find the 2303 date range that falls within the viewed real month.
function calMonthRange(year, month) {
    const start = calIso(year, month, 1);
    const end = calIso(year, month, new Date(year, month + 1, 0).getDate());
    let first = null, last = null;
    for (let d = start; d <= end; d = calAddDays(d, 1)) {
        const gds = calState.dateMap[d];
        if (gds && gds.length) {
            const gd = gds[0];
            const label = `${gd.playday} ${CAL_MONTHS_SHORT[gd.month - 1]}`;
            if (!first) first = label;
            const gdLast = gds[gds.length - 1];
            last = `${gdLast.playday} ${CAL_MONTHS_SHORT[gdLast.month - 1]}`;
        }
        // Also check preview dates.
        const preview = calProjectPreview(d);
        if (preview) {
            const label = `${preview.playday} ${CAL_MONTHS_SHORT[preview.month - 1]}`;
            if (!first) first = label;
            last = label;
        }
    }
    if (!first) return null;
    return first === last ? `du ${first} 2303` : `du ${first} au ${last} 2303`;
}

// ── Render : « Aujourd'hui » card ───────────────────────────────────

function renderTodayCard() {
    const card = document.getElementById('cal-today-card');
    if (!card) return;

    const todayIso = calIso(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const info = calClassify(todayIso);

    // Real date
    const [, m, d] = todayIso.split('-').map(Number);
    document.getElementById('cal-today-real').textContent =
        `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${todayIso.slice(0, 4)}`;

    // Game date
    if (info.type === 'play') {
        const gd = info.gds[info.gds.length - 1];
        document.getElementById('cal-today-game').textContent =
            `${CAL_MONTHS_SHORT[gd.month - 1]} ${gd.playday} ${gd.year}`;
    } else if (info.type === 'preview') {
        const pv = info.preview;
        document.getElementById('cal-today-game').textContent =
            `${CAL_MONTHS_SHORT[pv.month - 1]} ${pv.playday} ${pv.year} (prev.)`;
    } else if (info.type === 'pause') {
        document.getElementById('cal-today-game').textContent = 'En pause';
    } else {
        document.getElementById('cal-today-game').textContent = 'Hors de jeu';
    }

    // Days played (total game dates recorded)
    const totalPlayed = Object.values(calState.dateMap).reduce((sum, gds) => sum + gds.length, 0);
    document.getElementById('cal-today-played').textContent = String(totalPlayed);

    // Next play day
    let nextDay = null;
    if (calState.plannedResumeDate && todayIso < calState.plannedResumeDate) {
        const [ry, rm, rd] = calState.plannedResumeDate.split('-').map(Number);
        nextDay = `${CAL_WEEKDAYS[new Date(Date.UTC(ry, rm - 1, rd)).getUTCDay()].slice(0, 3)} ${rd}.${String(rm).padStart(2, '0')}`;
    } else {
        for (let d = calAddDays(todayIso, 1); d <= calAddDays(todayIso, 365); d = calAddDays(d, 1)) {
            const gds = calState.dateMap[d];
            if (gds && gds.length) {
                const [ny, nm, nd] = d.split('-').map(Number);
                nextDay = `${CAL_WEEKDAYS[new Date(Date.UTC(ny, nm - 1, nd)).getUTCDay()].slice(0, 3)} ${nd}.${String(nm).padStart(2, '0')}`;
                break;
            }
        }
    }
    document.getElementById('cal-today-next').textContent = nextDay || '—';

    card.hidden = false;
}

// ── Render : « Ce mois-ci » stats ───────────────────────────────────

function renderMonthStats() {
    const year = calState.viewYear;
    const month = calState.viewMonth;
    const start = calIso(year, month, 1);
    const end = calIso(year, month, new Date(year, month + 1, 0).getDate());

    let playDays = 0, pauseDays = 0;
    for (let d = start; d <= end; d = calAddDays(d, 1)) {
        const info = calClassify(d);
        if (info.type === 'play') playDays++;
        else if (info.type === 'pause') pauseDays++;
    }

    // Game advance: how many playdays in this month
    let advance = 0;
    for (let d = start; d <= end; d = calAddDays(d, 1)) {
        const gds = calState.dateMap[d];
        if (gds) advance += gds.length;
    }

    document.getElementById('cal-stat-play').textContent = String(playDays);
    document.getElementById('cal-stat-pause').textContent = String(pauseDays);
    document.getElementById('cal-stat-advance').textContent = `${advance} j`;
}

// ── Reprise du RP : bandeau + admin edit ────────────────────────────

function calRenderBanner() {
    const banner = document.getElementById('cal-resume-banner');
    if (!banner) return;

    if (!calState.isPaused) {
        banner.style.display = 'none';
        return;
    }

    if (calState.plannedResumeDate) {
        const dismissKey = CAL_BANNER_DISMISS_PREFIX + calState.plannedResumeDate;
        if (localStorage.getItem(dismissKey)) {
            banner.style.display = 'none';
            return;
        }
        banner.className = 'cal-resume-strip';
        banner.innerHTML = `<span class="cal-resume-strip__label">Reprise annoncée</span>`
            + `<span class="cal-resume-strip__text">Le RP reprend le <b>${calFmtFull(calState.plannedResumeDate)}</b> au matin. `
            + `D'ici là les commandes économiques restent ouvertes, les actions militaires sont gelées.</span>`
            + `<button class="cal-resume-strip__close" onclick="calDismissBanner()" title="Fermer">✕</button>`;
        banner.style.display = 'flex';
    } else if (isAdmin()) {
        banner.className = 'cal-resume-strip';
        banner.innerHTML = `<span class="cal-resume-strip__label">En pause</span>`
            + `<span class="cal-resume-strip__text">Le jeu est en pause et aucune date de reprise n'est encore planifiée.</span>`
            + `<button class="cal-btn" onclick="calOpenResumeModal()">Planifier</button>`;
        banner.style.display = 'flex';
    } else {
        banner.style.display = 'none';
    }
}

function calDismissBanner() {
    if (!calState.plannedResumeDate) return;
    try { localStorage.setItem(CAL_BANNER_DISMISS_PREFIX + calState.plannedResumeDate, '1'); } catch (e) {}
    calRenderBanner();
}

function calOpenResumeModal() {
    const input = document.getElementById('cal-resume-date-input');
    if (input) input.value = calState.plannedResumeDate || '';
    document.getElementById('cal-resume-overlay').classList.add('open');
}

function calCloseResumeModal() {
    document.getElementById('cal-resume-overlay').classList.remove('open');
}

async function calSubmitResumeDate(value) {
    try {
        const resp = await apiFetch('/api/admin/pause-schedule', {
            method: 'PUT',
            body: JSON.stringify({ planned_resume_date: value || null }),
        });
        if (resp && resp.success) {
            calState.plannedResumeDate = (resp.data && resp.data.planned_resume_date) || null;
            showToast('Date de reprise mise à jour.', 'success');
            calCloseResumeModal();
            renderCalendar();
            calRenderBanner();
            renderAdminPanel();
        } else {
            showToast((resp && resp.error) || 'Erreur de mise à jour', 'error');
        }
    } catch (e) {
        showToast('Erreur de mise à jour', 'error');
    }
}

function calSaveResumeDate() {
    const input = document.getElementById('cal-resume-date-input');
    calSubmitResumeDate(input ? input.value : '');
}

function calClearResumeDate() {
    calSubmitResumeDate(null);
}

// ── Administration du calendrier ────────────────────────────────────

function renderAdminPanel() {
    const panel = document.getElementById('cal-admin');
    if (!panel) return;
    if (!isAdmin()) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'block';

    const status = document.getElementById('cal-admin-status');
    if (status) {
        status.innerHTML = calState.isPaused
            ? 'Statut : <strong>en pause</strong>'
            : 'Statut : <strong>en cours</strong>';
    }
    const pauseBtn = document.getElementById('cal-admin-pause-btn');
    if (pauseBtn) {
        pauseBtn.textContent = calState.isPaused ? 'Reprendre le RP' : 'Mettre en pause';
        pauseBtn.className = calState.isPaused ? 'cal-btn cal-btn-primary' : 'cal-btn cal-btn-danger';
    }

    const fields = document.getElementById('cal-playdays');
    if (fields && !fields.dataset.rendered) {
        fields.innerHTML = CAL_MONTHS.map((label, i) => `
            <div class="cal-playday-field">
                <label for="cal-pd-${i + 1}">${label}</label>
                <input class="cal-input" type="number" min="0" max="99"
                       id="cal-pd-${i + 1}" data-month="${i + 1}">
            </div>`).join('');
        fields.dataset.rendered = '1';
    }
    if (fields) {
        for (let m = 1; m <= 12; m++) {
            const input = document.getElementById(`cal-pd-${m}`);
            if (input && document.activeElement !== input) {
                input.value = calState.playdaysPerMonth[String(m)] ?? '';
            }
        }
    }
}

async function calTogglePause() {
    const next = calState.isPaused ? 'reprendre le RP' : 'mettre le RP en pause';
    if (!confirm(`Confirmer : ${next} ?`)) return;
    const resp = await apiFetch('/api/admin/pause', { method: 'POST' });
    if (resp && resp.success) {
        calState.isPaused = !!(resp.data && resp.data.is_paused);
        showToast(calState.isPaused ? 'RP mis en pause.' : 'RP repris.', 'success');
        calRenderBanner();
        renderAdminPanel();
    } else {
        showToast((resp && resp.error) || 'Erreur lors du changement de statut', 'error');
    }
}

async function calSavePlaydays() {
    const payload = {};
    for (let m = 1; m <= 12; m++) {
        const input = document.getElementById(`cal-pd-${m}`);
        if (!input || input.value === '') continue;
        const value = parseInt(input.value, 10);
        if (Number.isNaN(value) || value < 0) {
            showToast(`Valeur invalide pour ${CAL_MONTHS[m - 1]}`, 'error');
            return;
        }
        payload[String(m)] = value;
    }
    if (!Object.keys(payload).length) {
        showToast('Aucune valeur à enregistrer', 'error');
        return;
    }
    const resp = await apiFetch('/api/admin/playdays-per-month', {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    if (resp && resp.success) {
        calState.playdaysPerMonth = resp.data || payload;
        showToast('Jours de jeu par mois enregistrés.', 'success');
        renderCalendar();
    } else {
        showToast((resp && resp.error) || 'Erreur d\'enregistrement', 'error');
    }
}

async function calForceAdvance() {
    if (!confirm('Avancer le jour de jeu d\'un cran ? Cette action est immédiate et visible par tous les joueurs.')) return;
    const resp = await apiFetch('/api/admin/game-date/advance', { method: 'POST' });
    if (resp && resp.success) {
        const d = resp.data || {};
        showToast(
            d.year ? `Nouvelle date : ${CAL_MONTHS[(d.month || 1) - 1]} ${d.playday} ${d.year}` : 'Date avancée.',
            'success');
        loadCalendar(true);
    } else {
        showToast((resp && resp.error) || 'Erreur lors de l\'avancement', 'error');
    }
}

// Inline handlers in calendrier.html call these; a module scope is not global.
Object.assign(window, {
    calNavigate, calGoToday, calOpenNote, calSaveNote, calCloseNote, calNoteKeydown,
    calDismissBanner, calOpenResumeModal, calCloseResumeModal, calSaveResumeDate,
    calClearResumeDate, calTogglePause, calSavePlaydays, calForceAdvance,
});

loadCalendar();
// Admin controls appear as soon as the session resolves, without re-fetching.
ready().then(() => { calRenderBanner(); renderAdminPanel(); });