# La barre inter-sites se compile ici, depuis IntersiteNavbar/src — avec la
# même politique d'outils que le frontal. Il n'y a plus de copie suivie dans
# ce service : elle retardait toujours sur les sources (septembre 2026).
FROM node:22-alpine AS navbar
WORKDIR /build
COPY IntersiteNavbar/package.json IntersiteNavbar/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY IntersiteNavbar/vite.config.js ./
COPY IntersiteNavbar/src ./src
COPY deployment-policy.json /deployment-policy.json
RUN PR_TOOLS_MODE="$(node -p "require('/deployment-policy.json').dashboard_tools")" npx vite build

FROM python:3.12-slim

WORKDIR /app

COPY resurgence-web/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# The whole site (static pages + the Flask app that serves them)
COPY resurgence-web/ /app/
COPY --from=navbar /build/dist/intersite-navbar.js /app/components/intersite-navbar.js

# Non-web files. app.py also refuses to serve the sources that remain.
RUN rm -f /app/Dockerfile \
          /app/test-website.html \
          /app/LICENSE \
          /app/README.md \
          /app/robots.txt.bak \
          /app/verify-seo.sh \
          /app/analytics-report.txt \
    && rm -rf /app/.git \
              /app/.vscode \
              /app/test-results \
              /app/test-scripts \
              /app/__pycache__

ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1

# Port 80: the nginx vhost proxies projet-resurgence.fr to resurgence-web:80.
EXPOSE 80

CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:80", "--timeout", "60", "app:app"]
