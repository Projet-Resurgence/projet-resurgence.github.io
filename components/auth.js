// WebAuth SSO client for the vitrine site.
//
// Same flow as calc./catalog./play.: the token comes back either in ?token=
// (fresh login through auth.projet-resurgence.fr) or from the httpOnly
// pr_sso_token cookie set on .projet-resurgence.fr by another subdomain, which
// /api/auth/sso/bootstrap exchanges for a site token.
//
// Everything here is optional decoration for the public pages — a logged-out
// visitor sees exactly the site they saw before. /calendrier is the one page
// that reads window.PRAuth.getUser() to decide whether to show the admin
// controls, and the server re-checks is_admin on every write regardless.

const TOKEN_KEY = 'pr_web_token';

let _user = null;
let _readyPromise = null;

function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
}

function setToken(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch (e) {}
}

function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
}

function getUser() {
    return _user;
}

function isAdmin() {
    return !!(_user && _user.is_admin);
}

async function login() {
    const next = window.location.pathname + window.location.search;
    try {
        const r = await fetch(`/api/auth/discord/url?next=${encodeURIComponent(next)}`);
        const data = await r.json();
        if (data.url) window.location.href = data.url;
    } catch (e) {
        console.error('Login unavailable', e);
    }
}

function logout() {
    clearToken();
    window.location.href = '/api/auth/logout';
}

// fetch() with the bearer token attached, returning the parsed body.
// A 401 means the token died under us: drop it and report failure rather than
// bouncing the visitor off a public page.
async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = Object.assign(
        { 'Content-Type': 'application/json' },
        options.headers || {},
        token ? { Authorization: `Bearer ${token}` } : {}
    );
    const resp = await fetch(url, { ...options, headers });
    if (resp.status === 401) {
        clearToken();
        _user = null;
    }
    try { return await resp.json(); } catch (e) { return null; }
}

async function _verify(token) {
    try {
        const r = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        if (!r.ok) return null;
        const data = await r.json();
        return data.valid ? data.user : null;
    } catch (e) {
        return null;
    }
}

async function _bootstrap() {
    try {
        const r = await fetch('/api/auth/sso/bootstrap', { method: 'POST' });
        if (!r.ok) return null;
        const data = await r.json();
        if (data.valid && data.token && data.user) {
            setToken(data.token);
            return data.user;
        }
    } catch (e) {}
    return null;
}

async function _init() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('token');
    if (fromUrl) {
        setToken(fromUrl);
        const url = new URL(window.location);
        url.searchParams.delete('token');
        window.history.replaceState({}, '', url);
    }

    const token = getToken();
    if (token) {
        _user = await _verify(token);
        if (_user) return _user;
        clearToken();
    }

    _user = await _bootstrap();
    return _user;
}

// One shared init per page load; every caller awaits the same promise.
function ready() {
    if (!_readyPromise) {
        _readyPromise = _init().then((user) => {
            document.dispatchEvent(
                new CustomEvent('pr-auth-ready', { detail: { user } })
            );
            return user;
        });
    }
    return _readyPromise;
}

// Wires the login button + cog identity of a <resurgence-header>.
export function attachHeaderAuth(headerEl) {
    const root = headerEl.shadowRoot;
    const loginBtn = root.getElementById('login-btn');
    const siteHeader = root.querySelector('pr-site-header');

    loginBtn?.addEventListener('click', login);
    document.addEventListener('pr-logout', logout);

    ready().then((user) => {
        if (!user) {
            if (loginBtn) loginBtn.hidden = false;
            siteHeader?.setLoggedIn(false);
            return;
        }
        if (loginBtn) loginBtn.hidden = true;
        siteHeader?.setUser({
            username: user.guild_username || user.username || '',
            country_name: user.country_name || '',
            country_id: user.country_id,
        });
        // Flag is a second round-trip; the header renders fine without it.
        apiFetch('/api/me/header').then((data) => {
            if (data && data.success && data.flag_url) {
                siteHeader?.setUser({ flag_url: data.flag_url });
            }
        }).catch(() => {});
    });
}

const PRAuth = { ready, getUser, isAdmin, getToken, apiFetch, login, logout };
window.PRAuth = PRAuth;

export default PRAuth;
export { ready, getUser, isAdmin, apiFetch, login, logout };
