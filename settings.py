"""Environment configuration for the resurgence-web service.

All values come from the root .env via docker-compose — no per-service .env.
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

SECRET_KEY = os.getenv("RESURGENCE_WEB_SECRET_KEY", os.urandom(32).hex())

# ── Centralized WebAuth SSO (same pattern as WebCalculator / military catalog) ──
WEBAUTH_URL = os.getenv("RESURGENCE_WEB_WEBAUTH_URL", "http://webauth:5002").rstrip("/")
WEBAUTH_PUBLIC_URL = os.getenv(
    "RESURGENCE_WEB_WEBAUTH_PUBLIC_URL", "https://auth.projet-resurgence.fr"
).rstrip("/")
PUBLIC_URL = os.getenv(
    "RESURGENCE_WEB_PUBLIC_URL", "https://projet-resurgence.fr"
).rstrip("/")
SSO_COOKIE_NAME = os.getenv("RESURGENCE_WEB_SSO_COOKIE_NAME", "pr_sso_token")

JWT_SECRET = os.getenv("RESURGENCE_WEB_JWT_SECRET", os.urandom(32).hex())
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# MUST stay the internal Docker hostname: the external URL goes through
# Cloudflare, which challenges server-to-server requests.
PR_API_URL = os.getenv("RESURGENCE_WEB_PR_API_URL", "http://pr-api:5000").rstrip("/")
PR_API_CLIENT_ID = os.getenv("RESURGENCE_WEB_PR_API_CLIENT_ID", "resurgence-web")
PR_API_CLIENT_SECRET = os.getenv("RESURGENCE_WEB_PR_API_CLIENT_SECRET", "")
